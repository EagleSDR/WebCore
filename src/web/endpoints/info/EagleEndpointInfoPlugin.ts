export default interface EagleEndpointInfoPlugin {

    id: string;
    plugin_name: string;
    developer_name: string;
    version_major: number;
    version_minor: number;
    version_build: number;
    assets: { [name: string]: string };

}