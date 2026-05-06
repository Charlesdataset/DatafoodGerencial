import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type React from "react";
import { FormButton } from "../Inputs/Button/FormButton";
import { Flex } from "../Layout";

export interface AtionsProps {
  onDelete?: () => void;
  onEdit?: () => void;
}

const Actions: React.FC<AtionsProps> = ({ onDelete, onEdit }) => {
  return (
    <Flex justify="around" gap="sm">
      {onEdit && (
        <FormButton variant="link" onClick={onEdit}>
          <FontAwesomeIcon icon={faPencil} color="#0f8f69" style={{ width: 15, height: 15 }} />
        </FormButton>
      )}
      {onDelete && (
        <FormButton variant="link" onClick={onDelete}>
          <FontAwesomeIcon icon={faTrash} color="#cf3b3b" style={{ width: 15, height: 15 }} />
        </FormButton>
      )}
    </Flex>
  );
};

export default Actions;
