use std::collections::HashSet;

pub fn would_create_bridge_cycle(edges: &[(String, String)], from: &str, to: &str) -> bool {
    let mut stack = vec![to.to_string()];
    let mut visited = HashSet::new();

    while let Some(current) = stack.pop() {
        if current == from {
            return true;
        }

        if visited.insert(current.clone()) {
            stack.extend(
                edges
                    .iter()
                    .filter(|(source, _)| source == &current)
                    .map(|(_, target)| target.clone()),
            );
        }
    }

    false
}

#[cfg(test)]
mod tests {
    use super::would_create_bridge_cycle;

    #[test]
    fn detects_directed_bridge_cycle() {
        let edges = vec![
            ("A".to_string(), "B".to_string()),
            ("B".to_string(), "C".to_string()),
        ];

        assert!(would_create_bridge_cycle(&edges, "C", "A"));
        assert!(!would_create_bridge_cycle(&edges, "A", "C"));
    }
}
