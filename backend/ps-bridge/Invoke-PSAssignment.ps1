<#
.SYNOPSIS
    Assigns resources to tasks in Project Server using CSOM.
    Batches all assignment additions into a single Publish queue job.

.PARAMETER PwaUrl
    The PWA site URL (e.g., http://34.29.110.174/pwa)
.PARAMETER Username
    The Project Server username
.PARAMETER Password
    The Project Server password
.PARAMETER Domain
    The Windows domain
.PARAMETER ProjectName
    The name of the project to modify
.PARAMETER Assignments
    JSON string: [{"resourceName":"Sarah Ahmed","taskName":"UI Design"}]
.PARAMETER Action
    "assign", "list-projects", "list-resources", "list-tasks"
#>
param(
    [string]$PwaUrl = "http://34.29.110.174/pwa",
    [string]$Username = "info",
    [string]$Password = "",
    [string]$Domain = "EPMTRIAL",
    [string]$Action = "assign",
    [string]$ProjectName = "",
    [string]$Assignments = "[]"
)

$result = @{ success = $false; message = ""; data = $null; errors = @() }

try {
    # Load CSOM assemblies
    $isapi = "C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\16\ISAPI"
    Add-Type -Path "$isapi\Microsoft.ProjectServer.Client.dll"
    Add-Type -Path "$isapi\Microsoft.SharePoint.Client.dll"
    Add-Type -Path "$isapi\Microsoft.SharePoint.Client.Runtime.dll"

    $ctx = New-Object Microsoft.ProjectServer.Client.ProjectContext($PwaUrl)
    $secPwd = ConvertTo-SecureString $Password -AsPlainText -Force
    $ctx.Credentials = New-Object System.Net.NetworkCredential($Username, $secPwd, $Domain)

    # ── list-projects ──
    if ($Action -eq "list-projects") {
        $ctx.Load($ctx.Projects)
        $ctx.ExecuteQuery()
        $projects = @()
        foreach ($p in $ctx.Projects) {
            $projects += @{ id = $p.Id.ToString(); name = $p.Name; percentComplete = $p.PercentComplete }
        }
        $result.success = $true
        $result.message = "Found $($projects.Count) projects"
        $result.data = $projects
        Write-Output ($result | ConvertTo-Json -Depth 5 -Compress)
        exit 0
    }

    # ── list-resources ──
    if ($Action -eq "list-resources") {
        $ctx.Load($ctx.EnterpriseResources)
        $ctx.ExecuteQuery()
        $resources = @()
        foreach ($r in $ctx.EnterpriseResources) {
            $resources += @{ id = $r.Id.ToString(); name = $r.Name }
        }
        $result.success = $true
        $result.message = "Found $($resources.Count) enterprise resources"
        $result.data = $resources
        Write-Output ($result | ConvertTo-Json -Depth 5 -Compress)
        exit 0
    }

    # ── list-tasks ──
    if ($Action -eq "list-tasks") {
        if (-not $ProjectName) { throw "ProjectName is required" }
        $ctx.Load($ctx.Projects)
        $ctx.ExecuteQuery()
        $project = $ctx.Projects | Where-Object { $_.Name -eq $ProjectName }
        if (-not $project) { throw "Project '$ProjectName' not found" }
        $ctx.Load($project.Tasks)
        $ctx.ExecuteQuery()
        $tasks = @()
        foreach ($t in $project.Tasks) {
            $tasks += @{ id = $t.Id.ToString(); name = $t.Name; percentComplete = $t.PercentComplete; isSummary = $t.IsSummary }
        }
        $result.success = $true
        $result.message = "Found $($tasks.Count) tasks in '$ProjectName'"
        $result.data = $tasks
        Write-Output ($result | ConvertTo-Json -Depth 5 -Compress)
        exit 0
    }

    # ── assign ──
    if ($Action -eq "assign") {
        if (-not $ProjectName) { throw "ProjectName is required" }
        $assignmentList = $Assignments | ConvertFrom-Json
        if ($assignmentList.Count -eq 0) { throw "No assignments provided" }

        # Load projects and resources
        $ctx.Load($ctx.Projects)
        $ctx.ExecuteQuery()
        $project = $ctx.Projects | Where-Object { $_.Name -eq $ProjectName }
        if (-not $project) { throw "Project '$ProjectName' not found" }

        $ctx.Load($ctx.EnterpriseResources)
        $ctx.ExecuteQuery()
        $resourceLookup = @{}
        foreach ($r in $ctx.EnterpriseResources) { $resourceLookup[$r.Name] = $r.Id }

        # Note: Force check-in is handled by the bridge server (bridge-server.js)
        # via REST API before calling this script. If CICOCheckedOutInOtherSession
        # still occurs, the bridge will auto-retry after force check-in.

        # Checkout
        $draft = $project.CheckOut()
        $ctx.Load($draft)
        $ctx.Load($draft.Tasks)
        $ctx.Load($draft.Assignments)
        $ctx.Load($draft.ProjectResources)
        $ctx.ExecuteQuery()

        # Build lookup maps
        $taskLookup = @{}
        foreach ($t in $draft.Tasks) { $taskLookup[$t.Name] = $t.Id }

        $existingPR = @{}
        foreach ($pr in $draft.ProjectResources) { $existingPR[$pr.Id.ToString()] = $true }

        $existingAssn = @{}
        foreach ($a in $draft.Assignments) { $existingAssn["$($a.TaskId)-$($a.ResourceId)"] = $true }

        $added = 0; $skipped = 0; $details = @()

        foreach ($asgn in $assignmentList) {
            $resName = $asgn.resourceName
            $taskName = $asgn.taskName

            if (-not $resourceLookup.ContainsKey($resName)) {
                $result.errors += "Resource '$resName' not found"
                $skipped++; continue
            }
            $resId = $resourceLookup[$resName]

            if (-not $taskLookup.ContainsKey($taskName)) {
                $result.errors += "Task '$taskName' not found in '$ProjectName'"
                $skipped++; continue
            }
            $taskId = $taskLookup[$taskName]

            $key = "$taskId-$resId"
            if ($existingAssn.ContainsKey($key)) {
                $details += @{ resource = $resName; task = $taskName; status = "already_exists" }
                $skipped++; continue
            }

            # Add resource to project team if not already there
            # IMPORTANT: Pipe to $null to prevent CSOM object from polluting stdout
            if (-not $existingPR.ContainsKey($resId.ToString())) {
                $pri = New-Object Microsoft.ProjectServer.Client.ProjectResourceCreationInformation
                $pri.Id = $resId
                $pri.Name = $resName
                $draft.ProjectResources.Add($pri) | Out-Null
                $existingPR[$resId.ToString()] = $true
            }

            # Add assignment (in-memory only - NO queue job!)
            $ai = New-Object Microsoft.ProjectServer.Client.AssignmentCreationInformation
            $ai.ResourceId = $resId
            $ai.TaskId = $taskId
            $draft.Assignments.Add($ai) | Out-Null
            $existingAssn[$key] = $true
            $details += @{ resource = $resName; task = $taskName; status = "added" }
            $added++
        }

        if ($added -eq 0) {
            # Nothing new - just checkin
            $job = $draft.CheckIn($true) | Out-Null
            $ctx.ExecuteQuery()
            $result.success = $true
            $result.message = "No new assignments ($skipped skipped/exist)"
            $result.data = @{ added = 0; skipped = $skipped; assignments = $details }
            Write-Output ($result | ConvertTo-Json -Depth 5 -Compress)
            exit 0
        }

        # Single Publish+CheckIn = ONE queue job for ALL assignments
        $publishJob = $draft.Publish($true)
        $jobState = $ctx.WaitForQueue($publishJob, 120)

        $stateStr = $jobState.ToString()
        $result.success = ($stateStr -eq "Success")
        $result.message = "Publish: $stateStr. Added $added, skipped $skipped."
        $result.data = @{ added = $added; skipped = $skipped; publishState = $stateStr; assignments = $details }
        Write-Output ($result | ConvertTo-Json -Depth 5 -Compress)
        exit 0
    }

    throw "Unknown action: $Action"
} catch {
    # On error, try to force checkin to avoid leaving project locked
    try {
        if ($draft) {
            $draft.CheckIn($true) | Out-Null
            $ctx.ExecuteQuery()
        }
    } catch {}

    $result.success = $false
    $result.message = $_.Exception.Message
    $result.data = @{ stackTrace = $_.ScriptStackTrace }
    Write-Output ($result | ConvertTo-Json -Depth 5 -Compress)
    exit 1
}
