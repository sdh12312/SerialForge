use std::collections::HashMap;

use super::endpoint::VirtualEndpoint;

#[derive(Debug, Default)]
pub struct VirtualPortManager {
    endpoints: HashMap<String, VirtualEndpoint>,
}

impl VirtualPortManager {
    pub fn add_endpoint(&mut self, endpoint: VirtualEndpoint) {
        self.endpoints.insert(endpoint.id.clone(), endpoint);
    }

    pub fn endpoint_count(&self) -> usize {
        self.endpoints.len()
    }
}

#[cfg(test)]
mod tests {
    use super::{VirtualEndpoint, VirtualPortManager};

    #[test]
    fn stores_virtual_endpoint() {
        let mut manager = VirtualPortManager::default();
        manager.add_endpoint(VirtualEndpoint {
            id: "a".to_string(),
            name: "Virtual Port A".to_string(),
            rx_bytes: 0,
            tx_bytes: 0,
        });

        assert_eq!(manager.endpoint_count(), 1);
    }
}
