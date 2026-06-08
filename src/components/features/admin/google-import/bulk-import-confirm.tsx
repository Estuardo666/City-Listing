'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BulkImportConfirmProps {
  open: boolean
  totalRecords: number
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

export function BulkImportConfirm({
  open,
  totalRecords,
  onConfirm,
  onCancel,
  isLoading,
}: BulkImportConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isLoading && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Importación masiva
          </DialogTitle>
          <DialogDescription>
            Se encontraron más de 500 negocios ({totalRecords.toLocaleString()}). La importación será
            procesada en segundo plano para evitar bloqueos del sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
          <p>
            <strong>Total a importar:</strong> {totalRecords.toLocaleString()} negocios
          </p>
          <p>
            <strong>Procesamiento:</strong> En lotes de 50 registros
          </p>
          <p>
            <strong>Método:</strong> Job en segundo plano
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando job...
              </>
            ) : (
              'Procesar en segundo plano'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
