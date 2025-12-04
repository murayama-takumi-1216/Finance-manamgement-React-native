import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const Select = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Seleccionar...',
  error,
  disabled = false,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (option) => {
    onSelect(option.value);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.selectButton,
          error && styles.error,
          disabled && styles.disabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.selectText,
            !selectedOption && styles.placeholder,
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={COLORS.gray[500]}
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Seleccionar'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[500]} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  {item.icon && (
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.value === value ? COLORS.primary : COLORS.gray[600]}
                      style={styles.optionIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 6,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  error: {
    borderColor: COLORS.danger,
  },
  disabled: {
    backgroundColor: COLORS.gray[100],
    opacity: 0.7,
  },
  selectText: {
    fontSize: 16,
    color: COLORS.gray[900],
    flex: 1,
  },
  placeholder: {
    color: COLORS.gray[400],
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  selectedOption: {
    backgroundColor: COLORS.gray[50],
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.gray[700],
    flex: 1,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginHorizontal: 20,
  },
});

export default Select;
