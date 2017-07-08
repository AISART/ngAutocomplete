export class AutocompleteItem {

    title: string;
    id?: string;
    children: any[];
    original: any;

    constructor(title: string, id: string, original: any) {
        this.title = title;
        this.id = id;
        this.original = original;
    }

    /**
     * object must have an ID
     * @constructor
     */
    static TransformToAutocompleteItem(object: { id?: string; [value: string]: any }, titleKey: string, childrenKey: string | null = null) {
        const item = new AutocompleteItem(object[titleKey], object.id, object);

        /**
         * if there are children, add these.
         */
        if (childrenKey !== null) item.children = object[childrenKey];

        return item
    }
}