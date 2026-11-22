// modal szybkiego dodania aktu do repozytorium `dokumenty` - bez pełnego obiegu.
import React from 'react';
import { Modal } from '@/components/common';
import ActCreateForm from './ActCreateForm';
import type { ActCreateResult } from '@/types/acts';

interface NewActModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (result: ActCreateResult) => void;
}

export const NewActModal: React.FC<NewActModalProps> = ({ isOpen, onClose, onCreated }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Dodaj akt do repozytorium"
    subtitle="Szybkie dodanie (S2.2.A) — start obiegu „dokumenty” i zapis pliku jako wersji głównej"
    maxWidth="2xl"
  >
    <ActCreateForm onCreated={onCreated} onCancel={onClose} />
  </Modal>
);

export default NewActModal;
