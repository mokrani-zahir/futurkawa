<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Durée de stockage dépassée</title>
    <style>
        body  { font-family: Arial, sans-serif; color: #333; }
        .box  { border: 1px solid #e74c3c; border-radius: 6px; padding: 20px; max-width: 560px; margin: 30px auto; }
        h2    { color: #e74c3c; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        td    { padding: 8px 12px; border-bottom: 1px solid #eee; }
        td:first-child { font-weight: bold; width: 40%; }
    </style>
</head>
<body>
<div class="box">
    <h2>⚠ Durée de stockage dépassée</h2>
    <p>Le lot suivant a dépassé sa durée de stockage configurée et nécessite une attention immédiate.</p>

    <table>
        <tr><td>Lot</td><td>{{ $batch->name }}</td></tr>
        <tr><td>Zone</td><td>{{ $batch->zone->name ?? '—' }}</td></tr>
        <tr><td>Date de début</td><td>{{ $batch->storage_start_date->toDateString() }}</td></tr>
        <tr><td>Durée configurée</td><td>{{ $batch->storage_duration_days }} jours</td></tr>
        <tr><td>Date d'expiration</td><td>{{ $batch->expires_at->toDateString() }}</td></tr>
    </table>

    <p style="margin-top:20px;color:#888;font-size:12px;">
        Cet email a été généré automatiquement par FutureKawa.
    </p>
</div>
</body>
</html>
