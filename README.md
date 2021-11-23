# GU-key
a key for GeoSciML Geologic Units to describe complex features


__________
Vorschlag für einen Schlüssel zur Kodierung harmonisierter Geologischer Einheiten (GUKey)
Der GUKey beschreibt eine nach INSPIRE harmonisierte Geologische Einheit und enthält die Nummern der URIs aus dem GBA Thesaurus. Damit soll eine Verwendung der harmonisierten Information nach INSPIRE auch außerhalb von Datenbanksystemen (z.B. Webapplikationen und JavaScript) erleichtert werden.  
  
Beispiel: 	g120-g23-t20-ml158-pl44-pa26-ya35-oa34-ep50-ee12-GU-dn  
Reihenfolge: Geologic, Tekt., Lithology, Geologic Event, “GU”, desc. purpose  
  
1) Kodierung  
    - Bedeutung der Buchstaben-Kürzel in der festgelegten Reihenfolge:  
g.. geologische Einheit (Name), [n]  = Mehrfach-Einträge möglich
t.. tektonische Einheit (Name), [n]  
ml.. lithologischer Haupt-Bestandteil (main lithology value),   
pl.. lithologischer Neben-Bestandteil (present lithology), [n]  
pa.. Alter (preferred age),   
ya.. jüngeres Alter,   
oa.. älteres Alter, 		   [n]  
ep.. Event-Process, und   
ee.. Event-Environment  
dn.. zB defining norm, tn.. typical norm, oder in.. instance  
  
    - die Trennung der einzelnen Attribute erfolgt durch Bindestriche (minus), und muss mit einem -GU-tn (für Geologic Unit) plus Angabe des “Description Purpose” (zB tn für “typical norm”) abgeschlossen werden  
    - die Buchstaben-Kürzel werden mit der betreffenden Nummer der Concept-URI vom GBA Thesaurus kombiniert, zB ml158-, für Sedimentäres Material (http://resource.geolba.ac.at/lithology/158 vom „GBA Lithologie Thesaurus“)  
    - bei Mehrfach-Einträgen (zusammengesetzte Einheiten) werden die Codes hintereinander geschrieben, zB zwei Geologische Formationen g120-g23-, oder mehrere lithologische (Neben-)Bestandteile pl44-pl45-  
    - bei Geol. Events kann durch Mehrfach-Einträge auch eine „Event History“ gereiht von alt nach jung (?) angegeben werden.  
  
2) Anwendung  
    - aus dem GUKey kann ein kompletter Legendentext (Deutsch oder Englisch) automatisiert erstellt werden, welcher den „harmonisierten“ Inhalt einer Geologischen Einheit nach INSPIRE beschreibt  
    - er könnte zB in Webkarten, Profilbeschreibungen, Kartierungspunkten oder für Bohrabschnitte verwendet werden, ohne gleich ein komplettes Datenbanksystem mitzuführen.  
    - der GUKey kann in Datenbank Systemen (SQL, concat) automatisiert in einer eigenen zusätzlichen Tabellenspalte erstellt werden, und kodiert dabei mehrere verbundene Tabellen in einen definierten Text (String). Umgekehrt könnte aus dem GUKey eine Datenbankstruktur befüllt werden  
    - die Kodierung kann auch als Schlüssel im Sinne einer (sortierbaren) Generallegende(?) verwendet werden.  
    - Abfragen von WFS Services nach bestimmten Attributen sollten möglich sein  
    - Import in Excel mit leichten Modifikationen (zB Spaltentrennung nach g, t, pa und GU) sollte möglich sein  
  
3) Validierung  
    - eine Validierung kann praktisch über eine Website in JavaScript erfolgen, ebenso wie der GUKey auch in Webkarten und Linked Data als validierte Definition eines Legendeneintrags verwendet werden kann  
    - der GUKey darf keine Leerzeichen enthalten und muss mit GU-xx abgeschlossen werden  
    - ml.. Lithologischer Haupt-Bestandteil darf nur einmal vorkommen  
    - Mindestanforderung pa.. für jeden neuen Geologic Event  
    - ein gültiger Key muss, bei nicht vollständig harmonisierten Einträgen, nicht alle Attribute enthalten (zB. nur g952-GU-dn für „Zollner Formation“ oder pa26-GU-in für Mesozoikum)  
    - die Reihenfolge der Attribute, wie unter 1) Kodierung beschrieben, muss aber jedenfalls, u.a. wegen der Identifizierbarkeit von Mehrfach-Einträgen, eingehalten werden  
