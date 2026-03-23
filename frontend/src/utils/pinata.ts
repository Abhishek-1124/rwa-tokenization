export type PinataUploadResult = {
  cid: string;
  ipfsUri: string; // ipfs://<cid>
  gatewayUrl: string; // https://gateway.pinata.cloud/ipfs/<cid>
};

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

function requireEnv(name: string): string {
  const v = import.meta.env[name] as string | undefined;
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getPinataJwt(): string {
  // JWT is preferred for browser-side upload.
  return requireEnv('VITE_PINATA_JWT');
}

async function pinataRequest<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Pinata error (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function pinFileToIPFS(file: File, name?: string): Promise<PinataUploadResult> {
  const jwt = getPinataJwt();
  const form = new FormData();
  form.append('file', file, name || file.name);

  const body = await pinataRequest<{ IpfsHash: string }>(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: form,
    }
  );

  const cid = body.IpfsHash;
  return { cid, ipfsUri: `ipfs://${cid}`, gatewayUrl: `${PINATA_GATEWAY}${cid}` };
}

export async function pinJSONToIPFS(json: unknown, name?: string): Promise<PinataUploadResult> {
  const jwt = getPinataJwt();
  const body = await pinataRequest<{ IpfsHash: string }>(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataMetadata: name ? { name } : undefined,
        pinataContent: json,
      }),
    }
  );

  const cid = body.IpfsHash;
  return { cid, ipfsUri: `ipfs://${cid}`, gatewayUrl: `${PINATA_GATEWAY}${cid}` };
}


