import { createBox } from '@shopify/restyle';
import { Theme } from '@/constants/theme';

const Box = createBox<Theme>();

export type BoxProps = React.ComponentProps<typeof Box>;
export default Box;
