import Proveedor, { IProveedor, IRangoHorario, IHorarioLaboral } from '../models/proveedor.model';
import Cita from '../models/cita.model';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export class ProveedorService {
  static async crearProveedor(data: Partial<IProveedor>) {
    const nuevo = new Proveedor(data);
    await nuevo.save();
    return nuevo;
  }

  static async listarProveedores() {
    return Proveedor.find();
  }

  static async obtenerProveedor(id: string) {
    return Proveedor.findById(id);
  }

  static async obtenerDisponibilidad(
    proveedorId: string,
    fechaInicio: string,
    fechaFin: string
  ) {
    const proveedor = await Proveedor.findById(proveedorId);
    if (!proveedor) throw new Error('Proveedor no encontrado');

    const horarioBase = proveedor.horarioLaboral;
    const duracionTurno = proveedor.disponibilidad?.duracionTurno;

    if (!duracionTurno || typeof duracionTurno !== 'number') {
      throw new Error('El proveedor no tiene configurada la duración del turno.');
    }

    if (!horarioBase || !horarioBase.dias || horarioBase.dias.length === 0) {
      return {};
    }

    const citas = await Cita.find({
      proveedorId,
      fecha: { $gte: fechaInicio, $lte: fechaFin }
    });

    const disponibilidad: Record<string, string[]> = {};

    let current = dayjs(fechaInicio);
    const end = dayjs(fechaFin);

    while (current.isBefore(end) || current.isSame(end)) {
      const fechaStr = current.format('YYYY-MM-DD');
      disponibilidad[fechaStr] = [];

      const diaSemana = current.day() === 0 ? 7 : current.day();
      const diaLaboral = horarioBase.dias.find(d => d.dia === diaSemana);

      if (diaLaboral && diaLaboral.activo && diaLaboral.rangos.length > 0) {
        const horarios: string[] = [];

        for (const rango of diaLaboral.rangos) {
          let hora = dayjs(`${fechaStr} ${rango.inicio}`, 'YYYY-MM-DD HH:mm');
          const limite = dayjs(`${fechaStr} ${rango.fin}`, 'YYYY-MM-DD HH:mm');

          while (hora.isBefore(limite)) {
            horarios.push(hora.format('HH:mm'));
            hora = hora.add(duracionTurno, 'minute');
          }
        }

        const citasDelDia = citas.filter(c => c.fecha === fechaStr);

        disponibilidad[fechaStr] = horarios.filter(slot => {
          const slotStart = dayjs(`${fechaStr} ${slot}`, 'YYYY-MM-DD HH:mm');
          const slotEnd = slotStart.add(duracionTurno, 'minute');

          return !citasDelDia.some(cita => {
            const citaInicio = dayjs(`${cita.fecha} ${cita.horario.inicio}`, 'YYYY-MM-DD HH:mm');
            const citaFin = dayjs(`${cita.fecha} ${cita.horario.fin}`, 'YYYY-MM-DD HH:mm');

            return slotStart.isBefore(citaFin) && slotEnd.isAfter(citaInicio);
          });
        });
      }

      current = current.add(1, 'day');
    }

    return disponibilidad;
  }

  private static checkRangosSolapados(rangos: IRangoHorario[]): boolean {
    const intervalos = rangos
      .map(r => ({
        start: dayjs(r.inicio, 'HH:mm'),
        end: dayjs(r.fin, 'HH:mm')
      }))
      .sort((a, b) => a.start.valueOf() - b.start.valueOf());

    for (let i = 0; i < intervalos.length - 1; i++) {
      if (intervalos[i].end.isAfter(intervalos[i + 1].start)) {
        return true;
      }
    }
    return false;
  }

  static async guardarHorarioLaboral(proveedorId: string, horario: IHorarioLaboral) {
    for (const dia of horario.dias) {
      if (dia.activo && dia.rangos.length > 1) {
        if (ProveedorService.checkRangosSolapados(dia.rangos)) {
          throw new Error(`Los rangos de tiempo para el día ${dia.dia} se solapan.`);
        }
      }
    }

    const actualizado = await Proveedor.findByIdAndUpdate(
      proveedorId,
      {
        horarioLaboral: {
          ...horario,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!actualizado) throw new Error('Proveedor no encontrado');

    return actualizado;
  }
}
