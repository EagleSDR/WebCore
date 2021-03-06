import EagleWindowManager from "./EagleWindowManager";

// A layer is a pane that windows lay on. It also handles saving/loading
export default interface IEagleWindowLayer {

    Save(): any;
    Load(data: any): void;

}