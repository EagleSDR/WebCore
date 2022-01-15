import EagleEndpointInfoPlugin from "./EagleEndpointInfoPlugin";

export default interface EagleEndpointInfo {

    plugins: EagleEndpointInfoPlugin[];
    sockets: { [name: string]: string };

}