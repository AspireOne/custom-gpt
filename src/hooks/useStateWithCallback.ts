import { useState } from "react";

const useStateWithCallback = <T>(initialValue: T) => {
    const [value, setValue] = useState<T>(initialValue);

    const setValueAndCallback = (newValue: (T) => T, callback?: (prevVal: T, newVal: T) => void) => {
        setValue(prevValue => {
            if (callback) {
                callback(prevValue, newValue);
            }
            return newValue;
        });
    };

    return [value, setValueAndCallback];
}

export { useStateWithCallback};