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
        owner_phone_prefix: "+1",
        owner_phone: "",
        owner_email: "",
        owner_birthdate: "",
        owner_gender: "",
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
          const totalAssistantValue = watch(
            `usuarios.${index}.total_assistant`
          );
          return (
            <div key={field.id} className="user-details-form">
              <h4>
                <span className="user-details-form-number">{index + 1}</span>
                {isAbooking ? "Booker Information" : "Assistant Information"}
              </h4>
              <div className="sep" />
              <div className="form-content-container">
                {/* Name */}
                <div className="form-field">
                  <label>
                    Name <span className="form-field-required">*</span>
                  </label>
                  <input
                    {...register(`usuarios.${index}.owner_name`, {
                      required: "Name is required",
                    })}
                    placeholder="Enter your name"
                    autoComplete="given-name"
                  />
                  {errors.usuarios?.[index]?.owner_name && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_name.message}
                    </p>
                  )}
                </div>

                {/* Surname */}
                <div className="form-field">
                  <label>
                    Surname <span className="form-field-required">*</span>
                  </label>
                  <input
                    {...register(`usuarios.${index}.owner_last_name`, {
                      required: "Surname is required",
                    })}
                    placeholder="Enter your surname"
                    autoComplete="family-name"
                  />
                  {errors.usuarios?.[index]?.owner_last_name && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_last_name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="form-field">
                  <label>
                    Email <span className="form-field-required">*</span>
                  </label>
                  <input
                    type="email"
                    {...register(`usuarios.${index}.owner_email`, {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email address",
                      },
                    })}
                    placeholder="email@example.com"
                    autoComplete="email"
                  />
                  {errors.usuarios?.[index]?.owner_email && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="form-field">
                  <label>
                    Phone Number <span className="form-field-required">*</span>
                  </label>
                  <div className="phone-input-container">
                    <div className="phone-prefix-select">
                      <select
                        {...register(`usuarios.${index}.owner_phone_prefix`)}
                      >
                        <option value="+1">+1</option>
                        <option value="+7">+7</option>
                        <option value="+20">+20</option>
                        <option value="+27">+27</option>
                        <option value="+30">+30</option>
                        <option value="+31">+31</option>
                        <option value="+32">+32</option>
                        <option value="+33">+33</option>
                        <option value="+34">+34</option>
                        <option value="+39">+39</option>
                        <option value="+40">+40</option>
                        <option value="+41">+41</option>
                        <option value="+43">+43</option>
                        <option value="+44">+44</option>
                        <option value="+45">+45</option>
                        <option value="+46">+46</option>
                        <option value="+47">+47</option>
                        <option value="+48">+48</option>
                        <option value="+49">+49</option>
                        <option value="+51">+51</option>
                        <option value="+52">+52</option>
                        <option value="+53">+53</option>
                        <option value="+54">+54</option>
                        <option value="+55">+55</option>
                        <option value="+56">+56</option>
                        <option value="+57">+57</option>
                        <option value="+58">+58</option>
                        <option value="+60">+60</option>
                        <option value="+61">+61</option>
                        <option value="+62">+62</option>
                        <option value="+63">+63</option>
                        <option value="+64">+64</option>
                        <option value="+65">+65</option>
                        <option value="+66">+66</option>
                        <option value="+81">+81</option>
                        <option value="+82">+82</option>
                        <option value="+84">+84</option>
                        <option value="+86">+86</option>
                        <option value="+90">+90</option>
                        <option value="+91">+91</option>
                        <option value="+92">+92</option>
                        <option value="+93">+93</option>
                        <option value="+94">+94</option>
                        <option value="+95">+95</option>
                        <option value="+98">+98</option>
                        <option value="+212">+212</option>
                        <option value="+213">+213</option>
                        <option value="+216">+216</option>
                        <option value="+218">+218</option>
                        <option value="+220">+220</option>
                        <option value="+234">+234</option>
                        <option value="+351">+351</option>
                        <option value="+352">+352</option>
                        <option value="+353">+353</option>
                        <option value="+354">+354</option>
                        <option value="+355">+355</option>
                        <option value="+356">+356</option>
                        <option value="+357">+357</option>
                        <option value="+358">+358</option>
                        <option value="+359">+359</option>
                        <option value="+370">+370</option>
                        <option value="+371">+371</option>
                        <option value="+372">+372</option>
                        <option value="+373">+373</option>
                        <option value="+374">+374</option>
                        <option value="+375">+375</option>
                        <option value="+376">+376</option>
                        <option value="+377">+377</option>
                        <option value="+378">+378</option>
                        <option value="+380">+380</option>
                        <option value="+381">+381</option>
                        <option value="+382">+382</option>
                        <option value="+385">+385</option>
                        <option value="+386">+386</option>
                        <option value="+387">+387</option>
                        <option value="+389">+389</option>
                        <option value="+420">+420</option>
                        <option value="+421">+421</option>
                        <option value="+423">+423</option>
                        <option value="+500">+500</option>
                        <option value="+501">+501</option>
                        <option value="+502">+502</option>
                        <option value="+503">+503</option>
                        <option value="+504">+504</option>
                        <option value="+505">+505</option>
                        <option value="+506">+506</option>
                        <option value="+507">+507</option>
                        <option value="+508">+508</option>
                        <option value="+509">+509</option>
                        <option value="+590">+590</option>
                        <option value="+591">+591</option>
                        <option value="+592">+592</option>
                        <option value="+593">+593</option>
                        <option value="+594">+594</option>
                        <option value="+595">+595</option>
                        <option value="+596">+596</option>
                        <option value="+597">+597</option>
                        <option value="+598">+598</option>
                        <option value="+599">+599</option>
                        <option value="+850">+850</option>
                        <option value="+852">+852</option>
                        <option value="+853">+853</option>
                        <option value="+855">+855</option>
                        <option value="+856">+856</option>
                        <option value="+880">+880</option>
                        <option value="+886">+886</option>
                        <option value="+960">+960</option>
                        <option value="+961">+961</option>
                        <option value="+962">+962</option>
                        <option value="+963">+963</option>
                        <option value="+964">+964</option>
                        <option value="+965">+965</option>
                        <option value="+966">+966</option>
                        <option value="+967">+967</option>
                        <option value="+968">+968</option>
                        <option value="+970">+970</option>
                        <option value="+971">+971</option>
                        <option value="+972">+972</option>
                        <option value="+973">+973</option>
                        <option value="+974">+974</option>
                        <option value="+975">+975</option>
                        <option value="+976">+976</option>
                        <option value="+977">+977</option>
                      </select>
                    </div>
                    <div className="phone-number-input">
                      <input
                        {...register(`usuarios.${index}.owner_phone`, {
                          required: "Phone number is required",
                          pattern: {
                            value: /^[0-9]{6,15}$/,
                            message: "Enter a valid phone number",
                          },
                        })}
                        placeholder="123456789"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  {errors.usuarios?.[index]?.owner_phone && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_phone.message}
                    </p>
                  )}
                </div>

                {/* Birthday */}
                <div className="form-field">
                  <label>
                    Date of Birth <span className="form-field-required">*</span>
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    {...register(`usuarios.${index}.owner_birthdate`, {
                      required: "Date of birth is required",
                    })}
                    autoComplete="bday"
                  />
                  {errors.usuarios?.[index]?.owner_birthdate && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_birthdate.message}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="form-field">
                  <label>
                    Gender <span className="form-field-required">*</span>
                  </label>
                  <div className="gender-selection">
                    <div className="gender-option">
                      <input
                        type="radio"
                        id={`gender-male-${index}`}
                        value="male"
                        {...register(`usuarios.${index}.owner_gender`, {
                          required: "Please select a gender",
                        })}
                      />
                      <label
                        htmlFor={`gender-male-${index}`}
                        className="gender-label"
                      >
                        Male
                      </label>
                    </div>
                    <div className="gender-option">
                      <input
                        type="radio"
                        id={`gender-female-${index}`}
                        value="female"
                        {...register(`usuarios.${index}.owner_gender`, {
                          required: "Please select a gender",
                        })}
                      />
                      <label
                        htmlFor={`gender-female-${index}`}
                        className="gender-label"
                      >
                        Female
                      </label>
                    </div>
                    <div className="gender-option">
                      <input
                        type="radio"
                        id={`gender-other-${index}`}
                        value="other"
                        {...register(`usuarios.${index}.owner_gender`, {
                          required: "Please select a gender",
                        })}
                      />
                      <label
                        htmlFor={`gender-other-${index}`}
                        className="gender-label"
                      >
                        Other
                      </label>
                    </div>
                  </div>
                  {errors.usuarios?.[index]?.owner_gender && (
                    <p className="user-form-error">
                      {errors.usuarios[index].owner_gender.message}
                    </p>
                  )}
                </div>

                {isAbooking && (
                  <>
                    <div className="form-field">
                      <label>
                        Start time <span className="form-field-required">*</span>
                      </label>
                      <input
                        type="time"
                        {...register(`usuarios.${index}.start_time`, {
                          required: "Start time is required",
                        })}
                        autoComplete="off"
                      />
                      {errors.usuarios?.[index]?.start_time && (
                        <p className="user-form-error">
                          {errors.usuarios[index].start_time.message}
                        </p>
                      )}
                    </div>
                    <div className="form-field">
                      <label>
                        End time <span className="form-field-required">*</span>
                      </label>
                      <input
                        type="time"
                        defaultValue={"06:00"}
                        {...register(`usuarios.${index}.end_time`, {
                          required: "End time is required",
                        })}
                        autoComplete="off"
                      />
                      {errors.usuarios?.[index]?.end_time && (
                        <p className="user-form-error">
                          {errors.usuarios[index].end_time.message}
                        </p>
                      )}
                    </div>
                    <div className="form-field">
                      <label>
                        Total assistants <span className="form-field-required">*</span>
                      </label>
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

                    <div className="form-field">
                      <label>
                        Payment options <span className="form-field-required">*</span>
                      </label>
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
                          Select payment type
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
                          <div key={i} className="form-field">
                            <label>
                              Assistant {i + 1} name <span className="form-field-required">*</span>
                            </label>
                            <input
                              placeholder={`Enter assistant ${i + 1} name`}
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