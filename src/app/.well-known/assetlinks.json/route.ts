import { getAssetLinks } from '@/lib/appDownload';

export const revalidate = 3600;

/** /.well-known/assetlinks.json on a store's own address (and a custom domain): Android reads it to let the Regantify app open this store's links. */
export async function GET() {
  return Response.json(await getAssetLinks(), { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
