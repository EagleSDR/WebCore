import EagleWindowImplementation from "../../../lib/ui/window/EagleWindowImplementation";
import IEagleWindowContext from "../../../lib/ui/window/IEagleWindowContext";

// Defines a registered window class. May be done from plugins.
export default interface IEagleWindowRegistration {

    // The name of this.
    GetDisplayName(): string;

    // Creates the actual element.
    Construct(context: IEagleWindowContext): EagleWindowImplementation;

}