import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { movementsAPI, documentsAPI } from '../../services/api';
import { Card, Loading, Button, Badge } from '../../components/common';
import { COLORS, formatCurrency, formatDate } from '../../constants';

const MovementDetailScreen = ({ route, navigation }) => {
  const { accountId, movementId } = route.params;
  const [movement, setMovement] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMovement = useCallback(async () => {
    try {
      setIsLoading(true);
      const [movementRes, docsRes] = await Promise.all([
        movementsAPI.getById(accountId, movementId),
        documentsAPI.getAll(accountId, movementId).catch(() => ({ data: [] })),
      ]);
      setMovement(movementRes.data.movement || movementRes.data);
      setDocuments(docsRes.data.documents || docsRes.data || []);
    } catch (error) {
      console.error('Error loading movement:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar el movimiento',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accountId, movementId]);

  useEffect(() => {
    loadMovement();
  }, [loadMovement]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMovement();
    setRefreshing(false);
  }, [loadMovement]);

  const handleConfirm = async () => {
    try {
      await movementsAPI.confirm(accountId, movementId);
      Toast.show({
        type: 'success',
        text1: 'Movimiento confirmado',
      });
      loadMovement();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo confirmar el movimiento',
      });
    }
  };

  if (isLoading) {
    return <Loading text="Cargando movimiento..." />;
  }

  if (!movement) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={64} color={COLORS.gray[300]} />
        <Text style={styles.errorText}>Movimiento no encontrado</Text>
      </View>
    );
  }

  const isIncome = movement.tipo === 'ingreso';
  const isPending = movement.estado === 'pendiente_revision';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Amount Card */}
      <Card
        style={[
          styles.amountCard,
          { borderLeftColor: isIncome ? COLORS.success : COLORS.danger },
        ]}
      >
        <View style={styles.amountHeader}>
          <View
            style={[
              styles.typeIcon,
              { backgroundColor: isIncome ? '#dcfce7' : '#fee2e2' },
            ]}
          >
            <Ionicons
              name={isIncome ? 'arrow-down' : 'arrow-up'}
              size={28}
              color={isIncome ? COLORS.success : COLORS.danger}
            />
          </View>
          <View>
            <Text style={styles.typeLabel}>
              {isIncome ? 'Ingreso' : 'Gasto'}
            </Text>
            {isPending && (
              <Badge label="Pendiente" variant="warning" size="small" />
            )}
          </View>
        </View>

        <Text
          style={[
            styles.amount,
            { color: isIncome ? COLORS.success : COLORS.danger },
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(movement.importe)}
        </Text>

        {isPending && (
          <Button
            title="Confirmar Movimiento"
            variant="success"
            onPress={handleConfirm}
            style={styles.confirmButton}
          />
        )}
      </Card>

      {/* Details Card */}
      <Card style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Detalles</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Descripción</Text>
          <Text style={styles.detailValue}>{movement.descripcion}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fecha</Text>
          <Text style={styles.detailValue}>
            {formatDate(movement.fechaOperacion, 'long')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Categoría</Text>
          <Text style={styles.detailValue}>
            {movement.categoria?.nombre || 'Sin categoría'}
          </Text>
        </View>

        {movement.proveedor && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Proveedor</Text>
            <Text style={styles.detailValue}>{movement.proveedor}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Estado</Text>
          <Badge
            label={isPending ? 'Pendiente' : 'Confirmado'}
            variant={isPending ? 'warning' : 'success'}
          />
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Moneda</Text>
          <Text style={styles.detailValue}>{movement.moneda}</Text>
        </View>
      </Card>

      {/* Tags */}
      {movement.etiquetas && movement.etiquetas.length > 0 && (
        <Card style={styles.tagsCard}>
          <Text style={styles.sectionTitle}>Etiquetas</Text>
          <View style={styles.tagsContainer}>
            {movement.etiquetas.map((tag) => (
              <Badge
                key={tag.id}
                label={tag.nombre}
                variant="primary"
                style={styles.tag}
              />
            ))}
          </View>
        </Card>
      )}

      {/* Documents */}
      <Card style={styles.documentsCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          <TouchableOpacity>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {documents.length > 0 ? (
          documents.map((doc) => (
            <View key={doc.id} style={styles.documentItem}>
              <Ionicons
                name="document-outline"
                size={24}
                color={COLORS.gray[600]}
              />
              <Text style={styles.documentName} numberOfLines={1}>
                {doc.nombre || doc.filename}
              </Text>
              <TouchableOpacity>
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noDocuments}>No hay documentos adjuntos</Text>
        )}
      </Card>

      {/* Timestamps */}
      <Card style={styles.timestampsCard}>
        <View style={styles.timestampRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.gray[400]} />
          <Text style={styles.timestampText}>
            Creado: {formatDate(movement.created_at, 'datetime')}
          </Text>
        </View>
        {movement.updated_at && (
          <View style={styles.timestampRow}>
            <Ionicons
              name="refresh-outline"
              size={16}
              color={COLORS.gray[400]}
            />
            <Text style={styles.timestampText}>
              Actualizado: {formatDate(movement.updated_at, 'datetime')}
            </Text>
          </View>
        )}
      </Card>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray[500],
  },
  amountCard: {
    margin: 16,
    padding: 20,
    borderLeftWidth: 4,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 4,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmButton: {
    marginTop: 8,
  },
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  tagsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  documentsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    gap: 12,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[700],
  },
  noDocuments: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    paddingVertical: 16,
  },
  timestampsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.gray[100],
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  bottomPadding: {
    height: 32,
  },
});

export default MovementDetailScreen;
