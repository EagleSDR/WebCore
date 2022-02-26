import EagleBaseProperty from "./EagleBaseProperty";

//Property that simply just stores a local value
export default class EagleLocalProperty<T> extends EagleBaseProperty<T> {

    constructor(defaultValue: T) {
        super(true);
        this.value = defaultValue;
    }

    private value: T;

    GetValue(): T {
        return this.value;
    }

    async SetValueInternal(value: T): Promise<void> {
        this.value = value;
    }
}