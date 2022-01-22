import IEagleKeyValuePersistentStorage from "../../../lib/misc/IEagleKeyValuePersistentStorage";

export default class EagleKeyValuePersistentStorage implements IEagleKeyValuePersistentStorage {

    constructor(namespace: string) {
        this.namespace = namespace;
    }

    private namespace: string;

    SetValue<T>(key: string, value: T): void {
        localStorage.setItem(this.namespace + "." + key, JSON.stringify(value));
    }

    GetValue<T>(key: string): T {
        var raw = localStorage.getItem(this.namespace + "." + key);
        if (raw == null)
            return null;
        else
            return JSON.parse(raw) as T;
    }

    CreateChild(namespace: string) {
        return new EagleKeyValuePersistentStorage(this.namespace + "." + namespace);
    }

}