class DamageCalculator:
    """
    Calculates exact plant leaf damage percentage and assigns agronomic severity tiers.
    Strictly calculates damaged lesion pixels relative to the detected leaf lamina area.
    """

    @staticmethod
    def calculate_metrics(total_leaf_area: int, damaged_area: int):
        """
        Calculates damage percentage, healthy percentage, and severity.
        
        Formula:
            damage_percentage = (damaged_leaf_area / total_leaf_area) * 100
            healthy_percentage = 100.0 - damage_percentage
        """
        leaf_area = max(1, int(total_leaf_area))
        damaged_area = min(leaf_area, max(0, int(damaged_area)))

        damage_percentage = round((damaged_area / leaf_area) * 100.0, 1)
        healthy_percentage = round(100.0 - damage_percentage, 1)

        severity = DamageCalculator.get_severity_level(damage_percentage)

        return {
            'leaf_area': leaf_area,
            'damaged_area': damaged_area,
            'damage_percentage': damage_percentage,
            'healthy_percentage': healthy_percentage,
            'severity': severity
        }

    @staticmethod
    def get_severity_level(damage_percentage: float) -> str:
        """
        Maps damage percentage to severity tier:
            0–5%:   Healthy / Very Low
            5–20%:  Mild
            20–40%: Moderate
            40–60%: Severe
            60–100%: Critical
        """
        if damage_percentage <= 5.0:
            return 'Healthy / Very Low'
        elif damage_percentage <= 20.0:
            return 'Mild'
        elif damage_percentage <= 40.0:
            return 'Moderate'
        elif damage_percentage <= 60.0:
            return 'Severe'
        else:
            return 'Critical'
