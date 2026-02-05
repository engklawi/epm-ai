/**
 * Microsoft Project Server REST API Client
 *
 * Handles NTLM-authenticated communication with Project Server.
 * Ported from scripts/upload-to-project-server.js with read + write capabilities.
 */

import httpntlm from 'httpntlm';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Parse the pipe-delimited Description field set by the upload script.
 * Input: "Strategic Objective: Digital Transformation | Status: In Progress | Health: YELLOW | ROI: 145% | Budget: $2.5M | Alignment: 92%"
 */
export function parseDescription(desc) {
  const result = {};
  if (!desc) return result;
  const parts = desc.split('|').map(s => s.trim());
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const key = part.substring(0, colonIdx).trim().toLowerCase().replace(/\s+/g, '');
    const value = part.substring(colonIdx + 1).trim();

    if (key === 'strategicobjective') result.strategicObjective = value;
    else if (key === 'status') result.status = value;
    else if (key === 'health') result.health = value.toLowerCase();
    else if (key === 'roi') result.roi = parseFloat(value) || 0;
    else if (key === 'budget') {
      const num = parseFloat(value.replace(/[$M,]/g, ''));
      result.budget = isNaN(num) ? 0 : num * 1000000;
    }
    else if (key === 'alignment') result.alignmentScore = parseFloat(value) || 0;
  }
  return result;
}

/**
 * Create a Project Server API client.
 */
export function createPSClient(config) {
  const { baseUrl, username, password, domain } = config;

  function ntlmRequest(method, url, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        url,
        username,
        password,
        domain,
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          ...headers,
        },
      };
      if (body) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
      const fn = { GET: httpntlm.get, POST: httpntlm.post, PATCH: httpntlm.patch, DELETE: httpntlm.delete }[method] || httpntlm.get;
      fn(options, (err, res) => {
        if (err) return reject(err);
        let data = null;
        if (res.body) {
          try { data = JSON.parse(res.body); } catch { data = res.body; }
        }
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });
  }

  async function getFormDigest() {
    const res = await ntlmRequest('POST', `${baseUrl}/_api/contextinfo`, '{}');
    if (res.status !== 200) throw new Error(`Form digest failed: ${res.status}`);
    const digest = res.data?.d?.GetContextWebInformation?.FormDigestValue;
    if (!digest) throw new Error('Form digest not found');
    return digest;
  }

  async function waitForQueue(jobId, maxWait = 60000) {
    if (!jobId) return;
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      try {
        const res = await ntlmRequest('GET',
          `${baseUrl}/_api/ProjectServer/WaitForQueue('${jobId}')`
        );
        if (res.status === 200) return;
      } catch { /* retry */ }
      await delay(2000);
    }
  }

  return {
    async testConnection() {
      try {
        const res = await ntlmRequest('GET', `${baseUrl}/_api/ProjectServer/Projects?$top=1&$select=Id`);
        return res.status === 200;
      } catch {
        return false;
      }
    },

    async getProjects() {
      const res = await ntlmRequest('GET',
        `${baseUrl}/_api/ProjectServer/Projects?$select=Id,Name,PercentComplete,Description,StartDate,FinishDate`
      );
      if (res.status !== 200) throw new Error(`GET Projects failed: ${res.status}`);
      return res.data?.d?.results || [];
    },

    async getProjectTasks(projectId) {
      const res = await ntlmRequest('GET',
        `${baseUrl}/_api/ProjectServer/Projects('${projectId}')/Tasks?$select=Id,Name,PercentComplete,FixedCost,Start,Finish`
      );
      if (res.status !== 200) throw new Error(`GET Tasks failed: ${res.status}`);
      return res.data?.d?.results || [];
    },

    async getEnterpriseResources() {
      const res = await ntlmRequest('GET',
        `${baseUrl}/_api/ProjectServer/EnterpriseResources?$select=Id,Name`
      );
      if (res.status !== 200) throw new Error(`GET Resources failed: ${res.status}`);
      return res.data?.d?.results || [];
    },

    async getCustomFields() {
      const res = await ntlmRequest('GET',
        `${baseUrl}/_api/ProjectServer/CustomFields?$select=Name,Id,InternalName,FieldType`
      );
      if (res.status !== 200) throw new Error(`GET CustomFields failed: ${res.status}`);
      const fields = res.data?.d?.results || [];
      const map = {};
      for (const f of fields) {
        if (f.Name.startsWith('EPM_')) {
          map[f.Name] = { id: f.Id, internalName: f.InternalName, fieldType: f.FieldType };
        }
      }
      return map;
    },

    async checkoutProject(projectId) {
      const digest = await getFormDigest();
      const res = await ntlmRequest('POST',
        `${baseUrl}/_api/ProjectServer/Projects('${projectId}')/checkOut`,
        '{}',
        { 'X-RequestDigest': digest }
      );
      if (res.status !== 200) throw new Error(`Checkout failed: ${res.status}`);
      return digest;
    },

    async updateTask(projectId, taskId, updates, digest) {
      const body = JSON.stringify({
        '__metadata': { 'type': 'PS.DraftTask' },
        ...updates,
      });
      const res = await ntlmRequest('PATCH',
        `${baseUrl}/_api/ProjectServer/Projects('${projectId}')/Draft/Tasks('${taskId}')`,
        body,
        { 'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'If-Match': '*' }
      );
      if (res.status !== 200 && res.status !== 204) {
        throw new Error(`Update task failed: ${res.status}`);
      }
    },

    async updateProjectDraft(projectId, updates, digest) {
      const body = JSON.stringify({
        '__metadata': { 'type': 'PS.DraftProject' },
        ...updates,
      });
      const res = await ntlmRequest('PATCH',
        `${baseUrl}/_api/ProjectServer/Projects('${projectId}')/Draft`,
        body,
        { 'X-RequestDigest': digest, 'X-HTTP-Method': 'MERGE', 'If-Match': '*' }
      );
      if (res.status !== 200 && res.status !== 204) {
        throw new Error(`Update project draft failed: ${res.status}`);
      }
    },

    async publishProject(projectId) {
      const digest = await getFormDigest();
      const res = await ntlmRequest('POST',
        `${baseUrl}/_api/ProjectServer/Projects('${projectId}')/Draft/publish(true)`,
        '{}',
        { 'X-RequestDigest': digest }
      );
      if (res.status !== 200) throw new Error(`Publish failed: ${res.status}`);
      const jobId = res.data?.d?.publish?.Value;
      await waitForQueue(jobId);
    },

    async addTaskAssignment(projectId, taskId, resourceId, digest) {
      const body = JSON.stringify({
        parameters: {
          ResourceId: resourceId,
          TaskId: taskId,
        }
      });
      const res = await ntlmRequest('POST',
        `${baseUrl}/_api/ProjectServer/Projects('${projectId}')/Draft/Assignments/Add`,
        body,
        { 'X-RequestDigest': digest }
      );
      if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Add assignment failed: ${res.status}`);
      }
    },
  };
}
