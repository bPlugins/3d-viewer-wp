
import { registerBlockType } from '@wordpress/blocks';

import metadata from "./block.json";
import "./editor.scss";
import Edit from "./Components/Backend/Edit";
import { icon } from '../../icons/icon';

registerBlockType(metadata, {
  edit: Edit,
  icon: icon,
  save: () => null,
});
