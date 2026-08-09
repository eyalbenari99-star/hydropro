def test_review_cockpit_contract(client):
    response = client.get('/api/rnd/cockpit/summary')
    assert response.status_code == 200
    body = response.json()
    assert body['portfolio_confidence'] == 89
    assert body['required_decisions'] >= 1
    assert body['source_versions']['projects']


def test_nexi_analysis_is_traceable_and_requires_human_review(client):
    response = client.post(
        '/api/rnd/projects/greenhouse-irrigation-07/nexi/analyze',
        headers={'X-HNX-Actor': 'engineer-42'},
        json={
            'source_revision_id': 'revision-12',
            'autonomy_mode': 'supervised',
            'discipline': 'plumbing',
            'jurisdiction': 'Philippines',
            'skip_questions': True,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body['findings'][0]['confidence'] >= .9
    assert body['findings'][0]['evidence']
    assert 'Qualified discipline engineer' in body['required_approvals']
    assert body['audit_ref'].startswith('audit:engineer-42:')


def test_change_preview_does_not_apply_and_exposes_rollback(client):
    response = client.post(
        '/api/rnd/change-sets/preview',
        headers={'X-HNX-Actor': 'engineer-42'},
        json={
            'project_id': 'greenhouse-irrigation-07',
            'base_revision_id': 'revision-12',
            'autonomy_mode': 'supervised',
            'requested_by': 'engineer-42',
            'operations': [{
                'operation': 'resize',
                'object_id': 'main-pipe',
                'before': {'diameter_mm': 50},
                'after': {'diameter_mm': 65},
                'reason': 'Reduce peak design velocity below approved limit',
            }],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body['requires_confirmation'] is True
    assert body['rollback_available'] is True
    assert 'BOM' in body['affected_outputs']
