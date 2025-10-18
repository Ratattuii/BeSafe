// Estilos globais da aplicação
import { StyleSheet } from 'react-native';

// Paleta de cores do BeSafe
export const colors = {
  // Cores principais da paleta fornecida
  primary: '#FF1434',      // Vermelho principal (urgente/crítico)
  primaryLight: '#F8CFCF', // Rosa claro (backgrounds suaves)
  secondary: '#F2F2F2',    // Cinza claro (backgrounds neutros)
  tertiary: '#F6F8F9',     // Cinza muito claro (cards/containers)
  
  // Variações da paleta principal
  urgent: '#FF1434',       // Vermelho para urgência
  urgentLight: '#FF4D61',  // Vermelho mais claro
  urgentDark: '#E6122E',   // Vermelho mais escuro
  
  // Cores de estado baseadas na paleta
  success: '#4CAF50',      // Verde para sucesso
  warning: '#FF9800',      // Laranja para avisos
  error: '#FF1434',        // Vermelho da paleta para erros
  info: '#2196F3',         // Azul para informações
  
  // Cores neutras derivadas da paleta
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F6F8F9',      // Usando o cinza mais claro da paleta
  gray200: '#F2F2F2',      // Usando o cinza da paleta
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  
  // Cores de texto
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF', // Texto branco em fundo vermelho
  
  // Cores de fundo
  background: '#FFFFFF',
  backgroundLight: '#F6F8F9',     // Usando o cinza mais claro da paleta
  backgroundCard: '#FFFFFF',
  backgroundNeutral: '#F2F2F2',   // Usando o cinza neutro da paleta
  backgroundSoft: '#F8CFCF',      // Usando o rosa claro da paleta
};

// Espaçamentos
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Tamanhos de fonte
export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Pesos de fonte
export const fontWeights = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Raios de borda
export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xl: 16,
  round: 50,
};

// Sombras
export const shadows = {
  small: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6.27,
    elevation: 4,
  },
  large: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10.32,
    elevation: 8,
  },
};

// Estilos globais comuns
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  padding: {
    padding: spacing.md,
  },
  paddingHorizontal: {
    paddingHorizontal: spacing.md,
  },
  paddingVertical: {
    paddingVertical: spacing.md,
  },
  margin: {
    margin: spacing.md,
  },
  marginHorizontal: {
    marginHorizontal: spacing.md,
  },
  marginVertical: {
    marginVertical: spacing.md,
  },
  textCenter: {
    textAlign: 'center',
  },
  textLeft: {
    textAlign: 'left',
  },
  textRight: {
    textAlign: 'right',
  },
  flexRow: {
    flexDirection: 'row',
  },
  flexColumn: {
    flexDirection: 'column',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  alignCenter: {
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    ...shadows.small,
  },
});
