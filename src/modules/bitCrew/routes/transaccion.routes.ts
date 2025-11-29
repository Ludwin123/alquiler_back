import { Router } from 'express';
// Importamos el controlador
import * as transaccionController from '../controllers/transaccion.controller';

const router = Router();

// ❌ ANTES (Error):
// router.get('/:id', transaccionController.handleGetTransaccionesByUsuario);

// ✅ AHORA (Correcto):
// Llamamos a la función que sí existe en tu controlador nuevo
router.get('/:id', transaccionController.handleGetTransaccionesByFixerId);

export default router;