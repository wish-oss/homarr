"use client";

import { useRouter } from "next/navigation";

import { clientApi } from "@homarr/api/client";
import { useForm, zodResolver } from "@homarr/form";
import {
  showErrorNotification,
  showSuccessNotification,
} from "@homarr/notifications";
import { useScopedI18n } from "@homarr/translation/client";
import { Button, PasswordInput, Stack, TextInput } from "@homarr/ui";
import type { z } from "@homarr/validation";
import { validation } from "@homarr/validation";

export const InitUserForm = () => {
  const router = useRouter();
  const t = useScopedI18n("user");
  const { mutateAsync, error, isPending } =
    clientApi.user.initUser.useMutation();
  const form = useForm<FormType>({
    validate: zodResolver(validation.user.init),
    validateInputOnBlur: true,
    validateInputOnChange: true,
    initialValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: FormType) => {
    console.log(values);
    await mutateAsync(values, {
      onSuccess: () => {
        showSuccessNotification({
          title: "User created",
          message: "You can now log in",
        });
        router.push("/auth/login");
      },
      onError: () => {
        showErrorNotification({
          title: "User creation failed",
          message: error?.message ?? "Unknown error",
        });
      },
    });
  };

  return (
    <Stack gap="xl">
      <form
        onSubmit={form.onSubmit(
          (v) => void handleSubmit(v),
          (err) => console.log(err),
        )}
      >
        <Stack gap="lg">
          <TextInput
            label={t("field.username.label")}
            {...form.getInputProps("username")}
          />
          <PasswordInput
            label={t("field.password.label")}
            {...form.getInputProps("password")}
          />
          <PasswordInput
            label={t("field.passwordConfirm.label")}
            {...form.getInputProps("confirmPassword")}
          />
          <Button type="submit" fullWidth loading={isPending}>
            {t("action.create")}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
};

type FormType = z.infer<typeof validation.user.init>;
