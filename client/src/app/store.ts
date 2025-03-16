import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userReducer from '../features/userSlice';
import persistReducer from 'redux-persist/es/persistReducer';
import storage from 'redux-persist/lib/storage';
import persistStore from 'redux-persist/es/persistStore';

// Corrected combineReducers syntax
const rootReducer = combineReducers({
  user: userReducer,
});

// Corrected persistConfig key
const persistConfig = {
  key: 'root',
  storage,
  version: 3,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);
