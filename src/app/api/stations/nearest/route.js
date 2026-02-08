import { getNearestStation } from '@/lib/data';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat'));
    const lon = parseFloat(searchParams.get('lon'));
    const systemsParam = searchParams.get('systems');
    const selectedSystems = systemsParam ? systemsParam.split(',') : [];

    if (isNaN(lat) || isNaN(lon)) {
        return Response.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const nearest = getNearestStation(lat, lon, selectedSystems);
    return Response.json(nearest);
}
