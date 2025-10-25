
import { useState, useCallback } from 'react';

type SetState<S> = (newState: S) => void;

export const useHistoryState = <S>(initialState: S): [S, SetState<S>, () => void, () => void, boolean, boolean] => {
    const [history, setHistory] = useState<S[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const state = history[currentIndex];

    const setState = useCallback((newState: S) => {
        // If the new state is the same as the current state, do nothing.
        if (newState === state) {
            return;
        }
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    }, [history, currentIndex, state]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    }, [currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    }, [currentIndex, history.length]);
    
    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    return [state, setState, undo, redo, canUndo, canRedo];
};
