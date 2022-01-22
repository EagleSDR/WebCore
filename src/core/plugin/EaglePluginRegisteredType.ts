import EaglePluginContext from "./EaglePluginContext";

// Maps an item to a plugin.
export default class EaglePluginRegisteredType<T> {

    constructor(plugin: EaglePluginContext, item: T) {
        this.plugin = plugin;
        this.item = item;
    }

    private plugin: EaglePluginContext;
    private item: T;

    GetPlugin(): EaglePluginContext {
        return this.plugin;
    }

    GetItem(): T {
        return this.item;
    }

}