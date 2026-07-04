const STORAGE_KEY = "training_questions";

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function saveQuestion({ name, question, mode }) {
  const items = getAll();
  const newItem = {
    id: crypto.randomUUID(),
    name: name || "Anónimo",
    question,
    docType: mode || "question",
    answered: false,
    createdAt: new Date().toISOString(),
    localCreatedAt: new Date().toISOString()
  };
  items.push(newItem);
  saveAll(items);
  return newItem;
}

export function getAllQuestions() {
  return getAll();
}

export function toggleAnswered(id) {
  const items = getAll();
  const item = items.find(q => q.id === id);
  if (item) item.answered = !item.answered;
  saveAll(items);
}

export function removeQuestion(id) {
  saveAll(getAll().filter(q => q.id !== id));
}

export function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
}

const listeners = new Set();
let pollInterval = null;

function notifyListeners() {
  const data = getAll();
  listeners.forEach(cb => cb(data));
}

export function subscribe(callback) {
  listeners.add(callback);
  callback(getAll());
  if (!pollInterval) {
    pollInterval = setInterval(notifyListeners, 300);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
}
