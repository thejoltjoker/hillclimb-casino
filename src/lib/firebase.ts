import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getFirestore, onSnapshot } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { derived, writable, type Readable } from 'svelte/store';
import type { CurrentRound } from './models/round.model';

const firebaseConfig = {
	apiKey: 'AIzaSyBRBeBYDrQoS72LLLXkt6HA0N57Y-7VpdA',
	authDomain: 'hillclimb-casino.firebaseapp.com',
	projectId: 'hillclimb-casino',
	storageBucket: 'hillclimb-casino.appspot.com',
	messagingSenderId: '776256492302',
	appId: '1:776256492302:web:50099102c9e02824657d5f',
	measurementId: 'G-3M3XNSHC4L'
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();

// Initialize emulators
// connectFirestoreEmulator(db, '127.0.0.1', 8080);
// connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

/**
 * @returns a store with the current firebase user
 */
function userStore() {
	let unsubscribe: () => void;

	if (!auth || !globalThis.window) {
		console.warn('Auth is not initialized or not in browser');
		const { subscribe } = writable<User | null>(null);
		return {
			subscribe
		};
	}

	const { subscribe } = writable(auth?.currentUser ?? null, (set) => {
		unsubscribe = onAuthStateChanged(auth, (user) => {
			set(user);
		});

		return () => unsubscribe();
	});

	return {
		subscribe
	};
}

export const user = userStore();

/**
 * @param  {string} path document path or reference
 * @param  {any} startWith optional default data
 * @returns a store with realtime updates on document data
 */
export function docStore<T>(path: string) {
	let unsubscribe: () => void;

	const docRef = doc(db, path);

	const { subscribe } = writable<T | null>(null, (set) => {
		unsubscribe = onSnapshot(docRef, (snapshot) => {
			set((snapshot.data() as T) ?? null);
		});

		return () => unsubscribe();
	});

	return {
		subscribe,
		ref: docRef,
		id: docRef.id
	};
}

export interface UserData {
	name: string;
	photoURL: string;
	role: string;
}

export const userData: Readable<UserData | null> = derived(user, ($user, set) => {
	if ($user) {
		return docStore<UserData>(`users/${$user.uid}`).subscribe(set);
	} else {
		set(null);
	}
});

export const currentRound = docStore<CurrentRound>('rounds/currentRound');
