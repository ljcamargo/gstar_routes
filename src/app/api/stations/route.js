import { findStationsByName } from '@/lib/data';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const systemsParam = searchParams.get('systems');
    const selectedSystems = systemsParam ? systemsParam.split(',') : [];

    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const lat = latParam !== null ? parseFloat(latParam) : null;
    const lon = lonParam !== null ? parseFloat(lonParam) : null;

    const results = findStationsByName(q, selectedSystems, lat, lon);
    return Response.json(results);
}
