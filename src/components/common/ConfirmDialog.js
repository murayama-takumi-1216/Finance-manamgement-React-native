import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Modal from './Modal';
import Button from './Button';
import { COLORS } from '../../constants';

const ConfirmDialog = ({
  visible,
  onClose,
  onConfirm,
  title = 'Confirmar',
  message = '¿Estás seguro de que deseas continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal visible={visible} onClose={onClose} title={title} size="small">
      <Text style={styles.message}>{message}</Text>
      <View style={styles.buttons}>
        <Button
          title={cancelText}
          variant="outline"
          onPress={onClose}
          style={styles.button}
          disabled={loading}
        />
        <Button
          title={confirmText}
          variant={variant}
          onPress={onConfirm}
          style={styles.button}
          loading={loading}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  message: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

export default ConfirmDialog;
