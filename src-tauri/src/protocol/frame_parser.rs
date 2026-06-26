use serde::{Deserialize, Serialize};

use super::types::{ByteOrder, FieldType};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FieldDefinition {
    pub name: String,
    pub field_type: FieldType,
    pub offset: usize,
    pub length: usize,
    pub byte_order: ByteOrder,
}

#[cfg(test)]
mod tests {
    use super::{ByteOrder, FieldDefinition, FieldType};

    #[test]
    fn keeps_field_definition_shape() {
        let field = FieldDefinition {
            name: "temperature".to_string(),
            field_type: FieldType::Float32,
            offset: 4,
            length: 4,
            byte_order: ByteOrder::LittleEndian,
        };

        assert_eq!(field.name, "temperature");
        assert_eq!(field.length, 4);
    }
}
