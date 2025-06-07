import { runTransaction, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const getNextId = async (collectionName) => {
	// Get a counter reference for the given collection name
	const counterRef = doc(db, "counters", collectionName);
	return await runTransaction(db, async (transaction) => {
		const counterDoc = await transaction.get(counterRef);
		let newId = 1;
		if (counterDoc.exists()) {
			const current = counterDoc.data().value;
			newId = current + 1;
			transaction.update(counterRef, { value: newId });
		} else {
			transaction.set(counterRef, { value: newId });
		}
		return newId;
	});
};
