// Previsualización de enlace (Open Graph) para /es/event/*
// Toda la lógica vive en functions-lib/event-og.js — ahí está el porqué.
import { handleEventOG } from "../../../functions-lib/event-og.js";

export const onRequest = handleEventOG;
