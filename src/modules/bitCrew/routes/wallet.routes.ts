import { Router } from 'express';

// IMPORTAMOS EL CONTROLADOR
import * as billeteraController from '../controllers/wallet.controller';

const router = Router();

// ❌ ANTES (Error):
// router.get('/:id', billeteraController.handleGetBilleteraByUsuario);

// ✅ AHORA (Correcto):
router.get(
  '/fixer/:id', 
  billeteraController.handleGetBilleteraByFixerId
);

export default router;