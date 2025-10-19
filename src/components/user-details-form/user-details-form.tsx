import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import "./user-details-form.css";
import type { UsuarioFormData } from "../../types/types";

export const UserDetailsForm = forwardRef(
  (
    {
      quantity,
      isAbooking,
      onQuantityChange,
    }: {
      quantity: number;
      isAbooking?: boolean;
      onQuantityChange?: (quantity: number) => void;
    },
    ref
  ) => {
    const defaultUsuarios = Array.from({ length: quantity }, () => {
      const baseUser = {
        owner_name: "",
        owner_last_name: "",
        owner_dpi: "",
        owner_phone: "",
        owner_email: "",
        confirmationMail: "",
        owner_birthdate: "",
      };

      return isAbooking
        ? {
            ...baseUser,
            payment_type: "",
            total_assistant: undefined,
            assistants: [],
          }
        : baseUser;
    });

    const {
      control,
      handleSubmit,
      register,
      watch,
      setValue,
      unregister,
      formState: { errors },
    } = useForm<{ usuarios: UsuarioFormData[] }>({
      defaultValues: {
        usuarios: defaultUsuarios,
      },
    });

    const { fields } = useFieldArray({
      control,
      name: "usuarios",
    });

    useImperativeHandle(ref, () => ({
      submit: (onSubmit: any) => handleSubmit(onSubmit)(),
    }));

    const totalAssistants = watch("usuarios.0.total_assistant");

    useEffect(() => {
      if (onQuantityChange) {
        if (totalAssistants && totalAssistants > 0) {
          onQuantityChange(Number(totalAssistants));
        } else {
          onQuantityChange(1);
        }
      }
    }, [totalAssistants, onQuantityChange]);

    useImperativeHandle(ref, () => ({
      submit: (onSubmit: any) => handleSubmit(onSubmit)(),
    }));

    useEffect(() => {
      if (totalAssistants) {
        const currentAssistants = Number(totalAssistants) - 1;

        const currentAssistantsArray = watch("usuarios.0.assistants") || [];

        if (currentAssistantsArray.length > currentAssistants) {
          for (
            let i = currentAssistants;
            i < currentAssistantsArray.length;
            i++
          ) {
            unregister(`usuarios.0.assistants.${i}`);
          }

          const newArray = currentAssistantsArray.slice(0, currentAssistants);
          setValue("usuarios.0.assistants", newArray);
        }
      }
    }, [totalAssistants, setValue, unregister, watch]);

    return (
      <form className="user-details-form-container">
        {fields.map((field, index) => {
          const email = watch(`usuarios.${index}.owner_email`);
          const totalAssistantValue = watch(
            `usuarios.${index}.total_assistant`
          );
          return (
            <div key={field.id} className="user-details-form">
              <h4>
                {isAbooking ? (
                  "Booker data"
                ) : (
                  <>Assistant data &#8226; {index + 1}</>
                )}
              </h4>
              <div className="sep" />
              <div className="form-content-container">
                <div>
                  <label>Name:</label>
                  <input
                    {...register(`usuarios.${index}.owner_name`, {
                      required: "The name is required",
                    })}
                    autoComplete="off"
                  />
                  {errors.usuarios?.[index]?.owner_name && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label>Surname:</label>
                  <input
                    {...register(`usuarios.${index}.owner_last_name`, {
                      required: "The surname is required",
                    })}
                    autoComplete="off"
                  />
                  {errors.usuarios?.[index]?.owner_last_name && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_last_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label>DPI number:</label>
                  <input
                    {...register(`usuarios.${index}.owner_dpi`, {
                      required: "The DPI number is required",
                      pattern: {
                        value: /^[0-9]{13}$/,
                        message: "The DPI must have 13 numeric digits",
                      },
                    })}
                    autoComplete="off"
                  />
                  {errors.usuarios?.[index]?.owner_dpi && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_dpi.message}
                    </p>
                  )}
                </div>
                <div>
                  <label>Telephone number:</label>
                  <input
                    {...register(`usuarios.${index}.owner_phone`, {
                      required: "The telephone is required",
                      pattern: {
                        value: /^[0-9]{8,15}$/,
                        message: "Check the telephone",
                      },
                    })}
                    autoComplete="off"
                  />
                  {errors.usuarios?.[index]?.owner_phone && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_phone.message}
                    </p>
                  )}
                </div>
                <div>
                  <label>Email:</label>
                  <input
                    type="email"
                    {...register(`usuarios.${index}.owner_email`, {
                      required: "The email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email",
                      },
                    })}
                    autoComplete="off"
                  />
                  {errors.usuarios?.[index]?.owner_email && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label>Email confirmation:</label>
                  <input
                    type="email"
                    {...register(`usuarios.${index}.confirmationMail`, {
                      required: "The email confirmation is required",
                      validate: (value) =>
                        value === email || "The emails do not match",
                    })}
                    autoComplete="off"
                  />
                  {errors.usuarios?.[index]?.confirmationMail && (
                    <p className="user-form-error">
                      {errors.usuarios[index].confirmationMail.message}
                    </p>
                  )}
                </div>
                <div>
                  <label>Birthday date:</label>
                  <input
                    type="date"
                    {...register(`usuarios.${index}.owner_birthdate`, {
                      required: "The birthday date is required",
                    })}
                    autoComplete="off"
                  />
                  {errors.usuarios?.[index]?.owner_birthdate && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_birthdate.message}
                    </p>
                  )}
                </div>
                {isAbooking && (
                  <>
                    <div>
                      <label>Start time:</label>
                      <input
                        type="time"
                        {...register(`usuarios.${index}.start_time`, {
                          required: "The start time is required",
                        })}
                        autoComplete="off"
                      />
                      {errors.usuarios?.[index]?.start_time && (
                        <p className="user-form-error">
                          {errors.usuarios[index].start_time.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label>End time:</label>
                      <input
                        type="time"
                        defaultValue={"06:00"}
                        {...register(`usuarios.${index}.end_time`, {
                          required: "The end time is required",
                        })}
                        autoComplete="off"
                      />
                      {errors.usuarios?.[index]?.end_time && (
                        <p className="user-form-error">
                          {errors.usuarios[index].end_time.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label>Total assistants:</label>
                      <input
                        type="number"
                        min={2}
                        {...register(`usuarios.${index}.total_assistant`, {
                          required: "Total assistants is required",
                          min: {
                            value: 2,
                            message: "At least 2 assistants are required",
                          },
                        })}
                        autoComplete="off"
                      />
                      {errors.usuarios?.[index]?.total_assistant && (
                        <p className="user-form-error">
                          {errors.usuarios[index].total_assistant.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label>Payment options</label>
                      <select
                        {...register(`usuarios.${index}.payment_type`, {
                          required: "Payment type is required",
                          validate: {
                            isNotEmpty: (value) =>
                              value !== "" || "Payment type is required",
                          },
                        })}
                      >
                        <option value="" disabled>
                          Selecciona tipo de pago
                        </option>
                        <option value="2">Per person</option>
                        <option value="1">One time payment</option>
                      </select>

                      {errors.usuarios?.[index]?.payment_type && (
                        <p className="user-form-error">
                          {errors.usuarios[index].payment_type.message}
                        </p>
                      )}
                    </div>

                    {totalAssistantValue &&
                      totalAssistantValue > 0 &&
                      [...Array(Number(totalAssistantValue) - 1)].map(
                        (_, i) => (
                          <div key={i}>
                            <label>Assistant names:</label>
                            <input
                              placeholder={`Assistant #${i + 1} name`}
                              {...register(
                                `usuarios.${index}.assistants.${i}`,
                                {
                                  required: "Assistant name is required",
                                }
                              )}
                              autoComplete="off"
                            />
                            {errors.usuarios?.[index]?.assistants?.[i] && (
                              <p className="user-form-error">
                                {
                                  errors.usuarios[index].assistants?.[i]
                                    ?.message
                                }
                              </p>
                            )}
                          </div>
                        )
                      )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </form>
    );
  }
);
