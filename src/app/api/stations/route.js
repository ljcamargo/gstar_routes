import { findStationsByName } from '@/lib/data';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return Response.json([]);
    }

    const results = findStationsByName(q);
    return Response.json(results);
}
