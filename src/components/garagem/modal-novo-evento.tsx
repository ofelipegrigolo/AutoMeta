import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ModalBase, modalStyles } from '@/components/garagem/modal-base';
import { OPCOES_COMBUSTIVEL, OPCOES_SERVICO } from '@/constants/garagem';
import type { NovoRegistro, OpcaoRegistro, TipoRegistro } from '@/types/garagem';
import { parseDecimal } from '@/utils/garagem';

type ModalNovoEventoProps = {
  visible: boolean;
  onClose: () => void;
  onSalvar: (dados: NovoRegistro) => Promise<void>;
};

const TIPOS_REGISTRO: TipoRegistro[] = ['Abastecimento', 'Serviço'];

function Chips({
  opcoes,
  selecionado,
  onSelecionar,
}: {
  opcoes: OpcaoRegistro[];
  selecionado: string;
  onSelecionar: (id: string) => void;
}) {
  return (
    <View style={styles.chipsRow}>
      {opcoes.map((opcao) => (
        <TouchableOpacity
          key={opcao.id}
          style={[styles.chip, selecionado === opcao.id && { borderColor: opcao.cor, borderWidth: 2 }]}
          onPress={() => onSelecionar(opcao.id)}>
          <Text style={styles.chipTexto}>{opcao.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Campo({
  label,
  obrigatorio,
  ...props
}: { label: string; obrigatorio?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>
        {label}
        {obrigatorio && <Text style={styles.asterisco}> *</Text>}
      </Text>
      <TextInput style={styles.input} placeholderTextColor="#a0a0a0" {...props} />
    </View>
  );
}

export function ModalNovoEvento({ visible, onClose, onSalvar }: ModalNovoEventoProps) {
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>('Abastecimento');
  const [combustivel, setCombustivel] = useState('Gasolina');
  const [servico, setServico] = useState('Troca de Óleo');
  const [servicoPersonalizado, setServicoPersonalizado] = useState('');
  const [quilometragem, setQuilometragem] = useState('');
  const [litros, setLitros] = useState('');
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const isAbastecimento = tipoRegistro === 'Abastecimento';

  const limparCampos = () => {
    setQuilometragem('');
    setLitros('');
    setValor('');
    setObservacao('');
    setServicoPersonalizado('');
  };

  const salvar = async () => {
    const km = parseDecimal(quilometragem);
    if (!(km > 0)) {
      Alert.alert('Atenção', 'Informe a quilometragem atual.');
      return;
    }

    const qtdLitros = isAbastecimento ? parseDecimal(litros) : 0;
    if (isAbastecimento && !(qtdLitros > 0)) {
      Alert.alert('Atenção', 'Informe a quantidade abastecida.');
      return;
    }

    const valorTotal = parseDecimal(valor);
    if (!valor.trim() || !Number.isFinite(valorTotal) || valorTotal < 0) {
      Alert.alert('Atenção', 'Informe o valor do evento.');
      return;
    }

    const descricao = isAbastecimento
      ? combustivel
      : servico === 'Outro'
        ? servicoPersonalizado.trim() || 'Outro Serviço'
        : servico;

    setSalvando(true);
    try {
      await onSalvar({
        tipoRegistro,
        tipoServicoOuCombustivel: descricao,
        litros: qtdLitros,
        quilometragem: km,
        valorTotal,
        observacao: isAbastecimento ? '' : observacao.trim(),
      });
      limparCampos();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      Alert.alert('Erro', 'Não foi possível salvar o registro.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalBase visible={visible} onClose={onClose}>
      <Text style={modalStyles.titulo}>Adicionar novo evento</Text>
      <Text style={modalStyles.subtitulo}>
        Inclua abaixo informações do evento que deseja incluir
      </Text>

      <View style={styles.tipos}>
        {TIPOS_REGISTRO.map((tipo) => {
          const ativo = tipoRegistro === tipo;
          return (
            <TouchableOpacity
              key={tipo}
              style={[styles.tipoBotao, ativo && styles.tipoBotaoAtivo]}
              onPress={() => setTipoRegistro(tipo)}>
              <Text style={ativo ? styles.tipoTextoAtivo : styles.tipoTextoInativo}>{tipo}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isAbastecimento ? (
        <Chips opcoes={OPCOES_COMBUSTIVEL} selecionado={combustivel} onSelecionar={setCombustivel} />
      ) : (
        <Chips opcoes={OPCOES_SERVICO} selecionado={servico} onSelecionar={setServico} />
      )}

      {!isAbastecimento && servico === 'Outro' && (
        <Campo
          label="Nome do serviço"
          obrigatorio
          placeholder="Ex: Alinhamento"
          value={servicoPersonalizado}
          onChangeText={setServicoPersonalizado}
        />
      )}

      <Campo
        label="Quilometragem Atual"
        obrigatorio
        placeholder="Ex: 125400"
        keyboardType="numeric"
        value={quilometragem}
        onChangeText={setQuilometragem}
      />

      {isAbastecimento && (
        <Campo
          label="Quantidade Abastecida"
          obrigatorio
          placeholder="Ex: 45,5"
          keyboardType="numeric"
          value={litros}
          onChangeText={setLitros}
        />
      )}

      <Campo
        label="Valor do Evento"
        obrigatorio
        placeholder="Ex: 250,00"
        keyboardType="numeric"
        value={valor}
        onChangeText={setValor}
      />

      {!isAbastecimento && (
        <Campo
          label="Observação (opcional)"
          placeholder="Ex: Troca de óleo sintético 5w30"
          value={observacao}
          onChangeText={setObservacao}
        />
      )}

      <TouchableOpacity
        style={[styles.botaoSalvar, salvando && styles.botaoDesabilitado]}
        onPress={salvar}
        disabled={salvando}>
        {salvando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botaoSalvarTexto}>Adicionar Evento</Text>
        )}
      </TouchableOpacity>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  tipos: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  tipoBotao: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0f0f0f',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  tipoBotaoAtivo: {
    backgroundColor: '#0f0f0f',
  },
  tipoTextoAtivo: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  tipoTextoInativo: {
    color: '#0f0f0f',
    fontWeight: '700',
    fontSize: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d4d4d4',
  },
  chipTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  campo: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    color: '#0f0f0f',
    marginBottom: 6,
  },
  asterisco: {
    color: '#ef4444',
  },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#0f0f0f',
  },
  botaoSalvar: {
    width: '100%',
    backgroundColor: '#0f0f0f',
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoSalvarTexto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
