"use client";

import { useRef, useState } from "react";

import type { RouterInputs } from "@homarr/api";
import {
  showErrorNotification,
  showSuccessNotification,
} from "@homarr/notifications";
import { useI18n, useScopedI18n } from "@homarr/translation/client";
import {
  Alert,
  Anchor,
  Group,
  IconCheck,
  IconInfoCircle,
  IconX,
  Loader,
} from "@homarr/ui";

import { api } from "~/trpc/react";

interface UseTestConnectionDirtyProps {
  defaultDirty: boolean;
  initialFormValue: {
    url: string;
    secrets: { kind: string; value: string | null }[];
  };
}

export const useTestConnectionDirty = ({
  defaultDirty,
  initialFormValue,
}: UseTestConnectionDirtyProps) => {
  const [isDirty, setIsDirty] = useState(defaultDirty);
  const prevFormValueRef = useRef(initialFormValue);

  return {
    onValuesChange: (values: typeof initialFormValue) => {
      if (isDirty) return;

      // If relevant values changed, set dirty
      if (
        prevFormValueRef.current.url !== values.url ||
        !prevFormValueRef.current.secrets
          .map((secret) => secret.value)
          .every(
            (secretValue, index) =>
              values.secrets[index]?.value === secretValue,
          )
      ) {
        setIsDirty(true);
        return;
      }

      // If relevant values changed back to last tested, set not dirty
      setIsDirty(false);
    },
    isDirty,
    removeDirty: () => {
      prevFormValueRef.current = initialFormValue;
      setIsDirty(false);
    },
  };
};

interface TestConnectionProps {
  isDirty: boolean;
  removeDirty: () => void;
  integration: RouterInputs["integration"]["testConnection"] & { name: string };
}

export const TestConnection = ({
  integration,
  removeDirty,
  isDirty,
}: TestConnectionProps) => {
  const t = useScopedI18n("integration.testConnection");
  const { mutateAsync, ...mutation } =
    api.integration.testConnection.useMutation();

  return (
    <Group>
      <Anchor
        type="button"
        component="button"
        onClick={async () => {
          await mutateAsync(integration, {
            onSuccess: () => {
              removeDirty();
              showSuccessNotification({
                title: t("notification.success.title"),
                message: t("notification.success.message"),
              });
            },
            onError: (error) => {
              if (error.data?.zodError?.fieldErrors.url) {
                showErrorNotification({
                  title: t("notification.invalidUrl.title"),
                  message: t("notification.invalidUrl.message"),
                });
                return;
              }

              if (error.message === "SECRETS_NOT_DEFINED") {
                showErrorNotification({
                  title: t("notification.notAllSecretsProvided.title"),
                  message: t("notification.notAllSecretsProvided.message"),
                });
                return;
              }

              showErrorNotification({
                title: t("notification.commonError.title"),
                message: t("notification.commonError.message"),
              });
            },
          });
        }}
      >
        {t("action")}
      </Anchor>
      <TestConnectionIcon isDirty={isDirty} {...mutation} size={20} />
    </Group>
  );
};

interface TestConnectionIconProps {
  isDirty: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  size: number;
}

const TestConnectionIcon = ({
  isDirty,
  isPending,
  isSuccess,
  isError,
  size,
}: TestConnectionIconProps) => {
  if (isPending) return <Loader color="blue" size={size} />;
  if (isDirty) return null;
  if (isSuccess) return <IconCheck size={size} stroke={1.5} color="green" />;
  if (isError) return <IconX size={size} stroke={1.5} color="red" />;
  return null;
};

export const TestConnectionNoticeAlert = () => {
  const t = useI18n();
  return (
    <Alert
      variant="light"
      color="yellow"
      title="Test Connection"
      icon={<IconInfoCircle />}
    >
      {t("integration.testConnection.alertNotice")}
    </Alert>
  );
};
