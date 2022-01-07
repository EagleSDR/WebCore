import EagleWindowImplementation from "../../../lib/ui/window/EagleWindowImplementation";
import IEagleWindowContext from "../../../lib/ui/window/IEagleWindowContext";

// Defines a registered window class. May be done from plugins.
export default interface IEagleWindowRegistration {

    // The name shown in the picker.
    GetDisplayName(): string;

    // Defines the name of the group. Items with the same group name are automatically grouped.
    GetGroupName(): string;

    // Generates a preview element. Should not be large or take a long time to create.
    GetPreview(): HTMLElement;

    // Creates the actual element.
    Construct(context: IEagleWindowContext): EagleWindowImplementation;

}