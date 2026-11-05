type Config = {
  keycloak : string,
  keycloak_client : string,
  api_url : string,
};

// wartości nadpisywalne w czasie builda (next build zapisuje
// `output: 'export'` - process.env.NEXT_PUBLIC_* jest wklejane na trwałe do
// statycznego bundla, nie da się tego zmienić po zbudowaniu). Domyślne
// wartości poniżej to środowisko deweloperskie. 
// Puste `api_url` oznacza wywołania względne ('/v1/wf' - zob. src/api/client.ts)
// - używane w produkcji, gdy nginx tego kontenera proxuje /v1/ do galwork-hub.
let CONFIG: Config =
{
  keycloak : process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://login.e-talar.com/realms/transmem',
  keycloak_client : process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT || 'transmem',
  api_url : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8086/v1/wf/',
};

export default CONFIG
