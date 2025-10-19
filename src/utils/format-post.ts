import type { UsuarioFormData } from "../types/types"

export const formatBookingPostData = ({ id, data, date, isTable }:
    {
        id: string,
        data: { usuarios: UsuarioFormData[] },
        date: string,
        isTable: boolean
    }) => {

    return {
        user: {
            name: data.usuarios[0].owner_name,
            surname: data.usuarios[0].owner_last_name,
            email: data.usuarios[0].owner_email,
            dpi: data.usuarios[0].owner_dpi
        },
        reservation: {
            venueId: id,
            date,
            startTime: data.usuarios[0].start_time,
            endTime: data.usuarios[0].end_time,
            guests: Number(data.usuarios[0].total_assistant),
            table: isTable,
            paymentTerm: data.usuarios[0].payment_type ? Number(data.usuarios[0].payment_type) : 3
        },
        guestNames: data.usuarios[0].assistants
    }
}