import * as Contacts from "expo-contacts";
import { useState } from "react";
import { Alert, Linking } from "react-native";

export interface Contact {
  id: string;
  name: string;
  phoneNumbers: Array<{
    number: string;
    label: string;
  }>;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      console.log("Current contacts permission status:", status);

      let finalStatus = status;

      if (status !== "granted") {
        const { status: newStatus } = await Contacts.requestPermissionsAsync();
        console.log("New contacts permission status:", newStatus);
        finalStatus = newStatus;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable contacts permission in settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );

        setError("Contacts permission denied");
        return false;
      }

      return true;
    } catch (err: any) {
      setError(err.message || "Permission request failed");
      return false;
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);

    try {
      const granted = await requestPermission();
      if (!granted) return;

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      const filteredContacts: Contact[] = (data as any[])
        .filter((contact: any) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact: any) => ({
          id: contact.id,
          name: contact.name || "Unknown",
          phoneNumbers: contact.phoneNumbers.map((phone: any) => ({
            number: phone.number || "",
            label: phone.label || "Mobile",
          })),
        }));

      setContacts(filteredContacts);
    } catch (err: any) {
      setError(err.message || "Failed to fetch contacts");
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    contacts,
    loading,
    error,
    requestPermission,
    fetchContacts,
  };
};