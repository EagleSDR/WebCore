import IEagleProperty from "../../../lib/core/port/IEagleProperty";
import EagleEventDispatcher from "../../../lib/EagleEventDispatcher";

export default abstract class EagleBaseProperty<T> implements IEagleProperty<T> {

    constructor(canEdit: boolean) {
        this.canEdit = canEdit;
    }

    private canEdit: boolean;

    abstract GetValue(): T;
    abstract SetValueInternal(value: T): Promise<void>;

    async SetValue(value: T): Promise<void> {
        await this.SetValueInternal(value);
        this.OnUpdated.Send(this.GetValue());
    }

    CanEdit(): boolean {
        return this.canEdit;
    }

    OnUpdated: EagleEventDispatcher<T> = new EagleEventDispatcher();

}