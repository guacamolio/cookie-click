<?php
header('Content-Type: application/json; charset=utf-8');

$saveFile = __DIR__ . '/../data/save-data.json';

if (!is_file($saveFile)) {
	echo json_encode(['success' => true, 'data' => null]);
	exit;
}

$data = json_decode(file_get_contents($saveFile), true);

if (!is_array($data)) {
	http_response_code(500);
	echo json_encode(['success' => false, 'error' => 'Saved game is invalid']);
	exit;
}

echo json_encode(['success' => true, 'data' => $data]);