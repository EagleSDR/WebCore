import EagleWindowManager from "../EagleWindowManager";

export default interface IEagleSubdivideItemParent {

    GetManager(): EagleWindowManager;
    RequestRemoval(): void;

}